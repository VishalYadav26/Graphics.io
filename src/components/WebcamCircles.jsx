"use client"

import { useRef, useEffect, useState } from "react"
import "./global.css" 

const WebcamCircles = () => {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [isVideoReady, setIsVideoReady] = useState(false)
  const [colorCombination, setColorCombination] = useState(["#000000", "#FFFFFF"]) // Default black & white
  const [showForm, setShowForm] = useState(true)

  useEffect(() => {
    const initWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play() 
          }
        }
      } catch (err) {
        console.error("Failed to access webcam", err)
      }
    }

    initWebcam()
  }, [])

  useEffect(() => {
    let animationFrameId

    const processFrame = () => {
      captureAndProcess()
      animationFrameId = requestAnimationFrame(processFrame)
    }

    if (isVideoReady) {
      processFrame()
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
    }
  }, [isVideoReady, colorCombination])

  const captureAndProcess = () => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const { videoWidth, videoHeight } = video


      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      const ctx = canvas.getContext("2d")
      if (ctx) {
        ctx.save()
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        ctx.restore()

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        processImageData(imageData, ctx)
      }
    }
  }

  const processImageData = (imageData, ctx) => {
    const { width, height, data } = imageData
    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, width, height)

    const circleSize = 10
    const spacing = 12

    for (let y = 0; y < height; y += spacing) {
      for (let x = 0; x < width; x += spacing) {
        const i = (y * width + x) * 4
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
        const radius = (brightness / 255) * (circleSize / 2)

        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        const [color1, color2] = colorCombination
        const color = interpolateColor(color1, color2, brightness / 255)
        ctx.fillStyle = color
        ctx.fill()
      }
    }
  }

  const interpolateColor = (color1, color2, factor) => {
    const hexToRgb = (hex) => {
      const bigint = parseInt(hex.slice(1), 16)
      return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255]
    }

    const rgbToHex = (r, g, b) =>
      `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`

    const rgb1 = hexToRgb(color1)
    const rgb2 = hexToRgb(color2)

    const r = Math.round(rgb1[0] + factor * (rgb2[0] - rgb1[0]))
    const g = Math.round(rgb1[1] + factor * (rgb2[1] - rgb1[1]))
    const b = Math.round(rgb1[2] + factor * (rgb2[2] - rgb1[2]))

    return rgbToHex(r, g, b)
  }

  const handleCanPlay = () => {
    setIsVideoReady(true)
  }

  const handleFormSubmit = (e) => {
    e.preventDefault()
    const color1 = e.target.color1.value
    const color2 = e.target.color2.value
    setColorCombination([color1, color2])
    setShowForm(false)
  }

  return (
    <div className="webcam-container">
      {showForm && (
        <form onSubmit={handleFormSubmit} className="color-form">
          <label>
            Primary Color:
            <input type="color" name="color1" defaultValue="#000000" />
          </label>
          <label>
            Secondary Color:
            <input type="color" name="color2" defaultValue="#FFFFFF" />
          </label>
          <button type="submit">Apply</button>
        </form>
      )}
      <video
        ref={videoRef}
        style={{ display: "none" }}
        onCanPlay={handleCanPlay}
        playsInline
        muted
      />
      <canvas ref={canvasRef} className="webcam-canvas" />
    </div>
  )
}

export default WebcamCircles